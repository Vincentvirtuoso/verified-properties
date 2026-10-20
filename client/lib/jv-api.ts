/* ============================================================
 * JV dummy API
 * Mirrors the contract in /areas/jv-requests.md. Access rules,
 * redaction, and ownership are enforced here the way the server
 * will enforce them. Replace bodies with fetch() calls when the
 * backend lands; pages don't change.
 * ============================================================ */

import {
  JV_PROFILES,
  JV_REQUESTS,
  JV_SUBSCRIPTIONS,
  JV_THREAD_MESSAGES,
  type JvRequestRecord,
  type JvRequestStatus,
  type JvResponseRecord,
  type JvStrategy,
  type JvThreadMessage,
} from "@/data/jv-requests";
import { JV_PLANS, type JvPlanId } from "@/data/jv-plans";

/* ============================================================
 * Types
 * ============================================================ */

export type JvViewer = { id: string; role: "viewer" | "agent" | "company" };

export class JvApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface JvRequestPayload {
  area: string;
  requestType: string;
  budgetMin: number;
  budgetMax: number;
  strategyPreference: JvStrategy;
  description: string;
}

export type NewJvRequestInput = JvRequestPayload;

export type ReadOnlyReason = "request_closed" | "inactive";
export type JvAccessReason =
  | "subscribed"
  | "not_subscribed"
  | "role_not_eligible";

// Subscriber view: no poster id, name, or contact.
export interface JvRequestPublic {
  id: string;
  posterLabel: "Verified poster" | "Unverified poster";
  area: string;
  requestType: string;
  budgetMin: number;
  budgetMax: number;
  strategyPreference: JvStrategy;
  description: string;
  createdAt: string;
  alreadyResponded: boolean;
}

// Poster view: contact details only on accepted responses.
export interface JvResponseOwn {
  id: string;
  message: string;
  status: JvResponseRecord["status"];
  createdAt: string;
  contact?: { name: string; email: string; phone: string };
}

export interface JvRequestOwn {
  id: string;
  posterVerified: boolean;
  area: string;
  requestType: string;
  budgetMin: number;
  budgetMax: number;
  strategyPreference: JvStrategy;
  description: string;
  status: JvRequestStatus;
  createdAt: string;
  updatedAt: string | null;
  nextEditAt: string | null;
  responses: JvResponseOwn[];
}

export interface JvThreadSummary {
  id: string;
  requestTitle: string;
  counterpartName: string;
  lastMessagePreview: string;
  lastActivityAt: string;
  readOnly: boolean;
  readOnlyReason?: ReadOnlyReason;
}

export interface JvThreadDetail {
  id: string;
  requestTitle: string;
  counterpart: { name: string; email: string; phone: string };
  messages: {
    id: string;
    text: string;
    sentAt: string;
    isMine: boolean;
    senderName: string;
  }[];
  readOnly: boolean;
  readOnlyReason?: ReadOnlyReason;
}

/* ============================================================
 * Constants
 * ============================================================ */

export const THREAD_INACTIVITY_DAYS = 90;
export const EDIT_COOLDOWN_HOURS = 5;
const HOUR_MS = 3_600_000;
const EDIT_COOLDOWN_MS = EDIT_COOLDOWN_HOURS * HOUR_MS;
const MIN_DESCRIPTION_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;
const DAY_MS = 86_400_000;

/* ============================================================
 * Internal helpers
 * ============================================================ */

const latency = () => new Promise((resolve) => setTimeout(resolve, 350));

function hasActiveSubscription(viewerId: string) {
  const sub = JV_SUBSCRIPTIONS[viewerId];
  return (
    !!sub && sub.status === "active" && new Date(sub.expiresAt) > new Date()
  );
}

// Browsing and responding need an agent or company role plus an active subscription.
function canBrowse(viewer: JvViewer) {
  return (
    (viewer.role === "agent" || viewer.role === "company") &&
    hasActiveSubscription(viewer.id)
  );
}

function findRequest(id: string) {
  return JV_REQUESTS.find((r) => r.id === id);
}

function findResponse(responseId: string) {
  for (const request of JV_REQUESTS) {
    const response = request.responses.find((res) => res.id === responseId);
    if (response) return { request, response };
  }
  return undefined;
}

function requireOwnRequest(viewer: JvViewer, id: string): JvRequestRecord {
  const request = findRequest(id);
  if (!request || request.posterId !== viewer.id) {
    throw new JvApiError(404, "Request not found or you do not have access.");
  }
  return request;
}

function validateRequestInput(input: JvRequestPayload) {
  if (!input.area.trim()) throw new JvApiError(400, "Area is required.");
  if (!input.requestType) throw new JvApiError(400, "Choose a request type.");
  if (!(input.budgetMin > 0) || input.budgetMax < input.budgetMin) {
    throw new JvApiError(400, "Check the budget range.");
  }
  if (input.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    throw new JvApiError(
      400,
      `Describe the request in at least ${MIN_DESCRIPTION_LENGTH} characters.`,
    );
  }
}

function toOwnView(r: JvRequestRecord): JvRequestOwn {
  return {
    id: r.id,
    posterVerified: JV_PROFILES[r.posterId]?.verified ?? false,
    area: r.area,
    requestType: r.requestType,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    strategyPreference: r.strategyPreference,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? null,
    nextEditAt: nextEditAtFor(r),
    responses: r.responses.map((res) => {
      const profile = JV_PROFILES[res.subscriberId];
      return {
        id: res.id,
        message: res.message,
        status: res.status,
        createdAt: res.createdAt,
        contact:
          res.status === "accepted" && profile
            ? { name: profile.name, email: profile.email, phone: profile.phone }
            : undefined,
      };
    }),
  };
}

// Thread helpers. A thread exists only for an accepted response; the response id is the thread id.
type ThreadContext = {
  request: JvRequestRecord;
  response: JvResponseRecord;
  messages: JvThreadMessage[];
};

function contextFor(
  request: JvRequestRecord,
  response: JvResponseRecord,
): ThreadContext {
  return { request, response, messages: JV_THREAD_MESSAGES[response.id] ?? [] };
}

function findThread(threadId: string): ThreadContext | undefined {
  for (const request of JV_REQUESTS) {
    for (const response of request.responses) {
      if (response.id === threadId && response.status === "accepted") {
        return contextFor(request, response);
      }
    }
  }
  return undefined;
}

function isParticipant(viewerId: string, ctx: ThreadContext) {
  return (
    ctx.request.posterId === viewerId || ctx.response.subscriberId === viewerId
  );
}

function counterpartOf(viewerId: string, ctx: ThreadContext) {
  return ctx.request.posterId === viewerId
    ? ctx.response.subscriberId
    : ctx.request.posterId;
}

function lastActivityOf(ctx: ThreadContext) {
  return (
    ctx.messages.at(-1)?.sentAt ??
    ctx.response.revealedAt ??
    ctx.response.createdAt
  );
}

// Policy: read-only when the request is closed or withdrawn, or after 90 days
// idle, counted from the last message. Subscription is never checked here.
function threadState(ctx: ThreadContext): {
  readOnly: boolean;
  readOnlyReason?: ReadOnlyReason;
} {
  if (ctx.request.status === "closed" || ctx.request.status === "withdrawn") {
    return { readOnly: true, readOnlyReason: "request_closed" };
  }
  const idleMs = Date.now() - new Date(lastActivityOf(ctx)).getTime();
  if (idleMs > THREAD_INACTIVITY_DAYS * DAY_MS) {
    return { readOnly: true, readOnlyReason: "inactive" };
  }
  return { readOnly: false };
}

/* ============================================================
 * Viewer and formatting
 * ============================================================ */

export function toJvViewer(user: {
  _id: string;
  activeRole?: unknown;
}): JvViewer {
  const role = String(user.activeRole ?? "").toLowerCase();
  return {
    id: user._id,
    role: role === "agent" || role === "company" ? role : "viewer",
  };
}

export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export const formatJvDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* ============================================================
 * Access
 * ============================================================ */

export async function getJvAccess(
  viewer: JvViewer,
): Promise<{ canBrowse: boolean; reason: JvAccessReason }> {
  await latency();
  if (viewer.role === "viewer")
    return { canBrowse: false, reason: "role_not_eligible" };
  if (!hasActiveSubscription(viewer.id))
    return { canBrowse: false, reason: "not_subscribed" };
  return { canBrowse: true, reason: "subscribed" };
}

/* ============================================================
 * Subscriber view: JV requests (redacted)
 * ============================================================ */

export async function listOpenJvRequests(
  viewer: JvViewer,
): Promise<JvRequestPublic[]> {
  await latency();
  if (!canBrowse(viewer)) {
    throw new JvApiError(
      403,
      "An active subscription is required to view JV requests.",
    );
  }
  return JV_REQUESTS.filter(
    (r) => r.status === "open" && r.posterId !== viewer.id,
  ).map((r) => ({
    id: r.id,
    posterLabel: JV_PROFILES[r.posterId]?.verified
      ? "Verified poster"
      : "Unverified poster",
    area: r.area,
    requestType: r.requestType,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    strategyPreference: r.strategyPreference,
    description: r.description,
    createdAt: r.createdAt,
    alreadyResponded: r.responses.some((res) => res.subscriberId === viewer.id),
  }));
}

/* ============================================================
 * Poster view: own requests and mutations
 * ============================================================ */

export async function listMyJvRequests(
  viewer: JvViewer,
): Promise<JvRequestOwn[]> {
  await latency();
  return JV_REQUESTS.filter((r) => r.posterId === viewer.id).map(toOwnView);
}

export async function getMyJvRequest(
  viewer: JvViewer,
  id: string,
): Promise<JvRequestOwn> {
  await latency();
  return toOwnView(requireOwnRequest(viewer, id));
}

export async function createJvRequest(
  viewer: JvViewer,
  input: NewJvRequestInput,
): Promise<JvRequestOwn> {
  await latency();
  validateRequestInput(input);

  const record: JvRequestRecord = {
    id: `jvr_${Date.now()}`,
    posterId: viewer.id,
    area: input.area.trim(),
    requestType: input.requestType,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    strategyPreference: input.strategyPreference,
    description: input.description.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: null,
    responses: [],
  };
  JV_REQUESTS.unshift(record);
  return toOwnView(record);
}

export async function updateJvRequest(
  viewer: JvViewer,
  id: string,
  payload: JvRequestPayload,
): Promise<JvRequestOwn> {
  await latency();
  const request = requireOwnRequest(viewer, id);

  if (request.status !== "open") {
    throw new JvApiError(409, "Only open requests can be edited.");
  }
  validateRequestInput(payload);

  const nextEditAt = nextEditAtFor(request);
  if (nextEditAt && Date.now() < new Date(nextEditAt).getTime()) {
    throw new JvApiError(
      429,
      `This request was edited recently. You can edit it again after ${EDIT_COOLDOWN_HOURS} hours.`,
    );
  }

  request.area = payload.area.trim();
  request.requestType = payload.requestType;
  request.budgetMin = payload.budgetMin;
  request.budgetMax = payload.budgetMax;
  request.strategyPreference = payload.strategyPreference;
  request.description = payload.description.trim();
  request.updatedAt = new Date().toISOString();

  return toOwnView(request);
}

export async function setJvRequestStatus(
  viewer: JvViewer,
  requestId: string,
  status: "closed" | "withdrawn",
): Promise<void> {
  await latency();
  const request = requireOwnRequest(viewer, requestId);
  if (request.status === "closed" || request.status === "withdrawn") {
    throw new JvApiError(409, "This request is already closed.");
  }
  request.status = status;
}

/* ============================================================
 * Responses
 * ============================================================ */

export async function respondToJvRequest(
  viewer: JvViewer,
  requestId: string,
  message: string,
): Promise<void> {
  await latency();
  if (!canBrowse(viewer)) {
    throw new JvApiError(403, "An active subscription is required to respond.");
  }
  const request = findRequest(requestId);
  if (!request) throw new JvApiError(404, "Request not found.");
  if (request.posterId === viewer.id) {
    throw new JvApiError(403, "You can't respond to your own request.");
  }
  if (request.status !== "open")
    throw new JvApiError(409, "This request is no longer open.");
  if (request.responses.some((res) => res.subscriberId === viewer.id)) {
    throw new JvApiError(409, "You have already responded to this request.");
  }

  const body = message.trim();
  if (!body) throw new JvApiError(400, "Write a short message.");
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new JvApiError(
      400,
      `Messages are limited to ${MAX_MESSAGE_LENGTH.toLocaleString("en-NG")} characters.`,
    );
  }

  request.responses.push({
    id: `jvres_${Date.now()}`,
    requestId,
    subscriberId: viewer.id,
    message: body,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

export async function acceptJvResponse(
  viewer: JvViewer,
  responseId: string,
): Promise<void> {
  await latency();
  const found = findResponse(responseId);
  if (!found) throw new JvApiError(404, "Response not found.");
  if (found.request.posterId !== viewer.id) {
    throw new JvApiError(403, "Only the poster can accept a response.");
  }
  if (found.request.status !== "open")
    throw new JvApiError(409, "This request is no longer open.");
  if (found.response.status !== "pending") {
    throw new JvApiError(409, "This response has already been handled.");
  }
  found.response.status = "accepted";
  found.response.revealedAt = new Date().toISOString();
  found.request.status = "matched";
}

export async function declineJvResponse(
  viewer: JvViewer,
  responseId: string,
): Promise<void> {
  await latency();
  const found = findResponse(responseId);
  if (!found) throw new JvApiError(404, "Response not found.");
  if (found.request.posterId !== viewer.id) {
    throw new JvApiError(403, "Only the poster can decline a response.");
  }
  if (found.response.status !== "pending") {
    throw new JvApiError(409, "This response has already been handled.");
  }
  found.response.status = "declined";
}

// Explicit poster action after a match. Accepting never auto-declines the rest.
export async function declineOtherJvResponses(
  viewer: JvViewer,
  requestId: string,
): Promise<number> {
  await latency();
  const request = requireOwnRequest(viewer, requestId);
  if (request.status !== "matched") {
    throw new JvApiError(409, "Accept a response before declining the others.");
  }

  let declined = 0;
  for (const res of request.responses) {
    if (res.status === "pending") {
      res.status = "declined";
      declined++;
    }
  }
  return declined;
}

/* ============================================================
 * Threads (accepted conversations)
 * Deliberately no subscription check: lapsed subscribers keep
 * access to accepted threads, per policy.
 * ============================================================ */

export async function listMyJvThreads(
  viewer: JvViewer,
): Promise<JvThreadSummary[]> {
  await latency();
  const threads: JvThreadSummary[] = [];

  for (const request of JV_REQUESTS) {
    for (const response of request.responses) {
      if (response.status !== "accepted") continue;
      const ctx = contextFor(request, response);
      if (!isParticipant(viewer.id, ctx)) continue;

      const last = ctx.messages.at(-1);
      threads.push({
        id: response.id,
        requestTitle: `${request.requestType} · ${request.area}`,
        counterpartName:
          JV_PROFILES[counterpartOf(viewer.id, ctx)]?.name ?? "Unknown",
        lastMessagePreview: last ? last.text.slice(0, 80) : "No messages yet",
        lastActivityAt: lastActivityOf(ctx),
        ...threadState(ctx),
      });
    }
  }

  return threads.sort((a, b) =>
    b.lastActivityAt.localeCompare(a.lastActivityAt),
  );
}

export async function getJvThread(
  viewer: JvViewer,
  threadId: string,
): Promise<JvThreadDetail> {
  await latency();
  const ctx = findThread(threadId);
  if (!ctx) throw new JvApiError(404, "Conversation not found.");
  if (!isParticipant(viewer.id, ctx)) {
    throw new JvApiError(403, "You are not part of this conversation.");
  }

  const other = JV_PROFILES[counterpartOf(viewer.id, ctx)];
  return {
    id: threadId,
    requestTitle: `${ctx.request.requestType} · ${ctx.request.area}`,
    counterpart: {
      name: other?.name ?? "Unknown",
      email: other?.email ?? "",
      phone: other?.phone ?? "",
    },
    messages: ctx.messages.map((m) => ({
      id: m.id,
      text: m.text,
      sentAt: m.sentAt,
      isMine: m.senderId === viewer.id,
      senderName: JV_PROFILES[m.senderId]?.name ?? "Unknown",
    })),
    ...threadState(ctx),
  };
}

export async function sendJvMessage(
  viewer: JvViewer,
  threadId: string,
  text: string,
): Promise<void> {
  await latency();
  const ctx = findThread(threadId);
  if (!ctx) throw new JvApiError(404, "Conversation not found.");
  if (!isParticipant(viewer.id, ctx)) {
    throw new JvApiError(403, "You are not part of this conversation.");
  }
  if (threadState(ctx).readOnly)
    throw new JvApiError(409, "This conversation is read-only.");

  const body = text.trim();
  if (!body) throw new JvApiError(400, "Write a message first.");
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new JvApiError(
      400,
      `Messages are limited to ${MAX_MESSAGE_LENGTH.toLocaleString("en-NG")} characters.`,
    );
  }

  // Only writes create the message list, so reads never mutate state.
  const list = (JV_THREAD_MESSAGES[threadId] ??= []);
  list.push({
    id: `msg_${Date.now()}`,
    senderId: viewer.id,
    text: body,
    sentAt: new Date().toISOString(),
  });
}

/* ============================================================
 * Subscription
 * ============================================================ */

export async function getJvSubscription(
  viewer: JvViewer,
): Promise<{ status: "active" | "lapsed"; expiresAt: string } | null> {
  await latency();
  const sub = JV_SUBSCRIPTIONS[viewer.id];
  if (!sub) return null;
  return {
    status: hasActiveSubscription(viewer.id) ? "active" : "lapsed",
    expiresAt: sub.expiresAt,
  };
}

export async function subscribeToJv(
  viewer: JvViewer,
  planId: JvPlanId,
): Promise<{ expiresAt: string }> {
  await latency();
  if (viewer.role !== "agent" && viewer.role !== "company") {
    throw new JvApiError(
      403,
      "Only agents and companies can subscribe to JV requests.",
    );
  }
  const plan = JV_PLANS.find((p) => p.id === planId);
  if (!plan) throw new JvApiError(400, "Choose a valid plan.");

  // Renewing while active extends from the current expiry, so no paid days are lost.
  const current = JV_SUBSCRIPTIONS[viewer.id];
  const startFrom =
    current && hasActiveSubscription(viewer.id)
      ? new Date(current.expiresAt).getTime()
      : Date.now();
  const expiresAt = new Date(
    startFrom + plan.durationDays * DAY_MS,
  ).toISOString();

  JV_SUBSCRIPTIONS[viewer.id] = { status: "active", expiresAt };
  return { expiresAt };
}

function nextEditAtFor(r: JvRequestRecord): string | null {
  return r.updatedAt
    ? new Date(new Date(r.updatedAt).getTime() + EDIT_COOLDOWN_MS).toISOString()
    : null;
}