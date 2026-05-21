import z from "zod";

export const videoBlockSchema = z.object({
  type: z.literal("video"),
  title: z.string().min(1, "Video title is required"),
  youtubeUrl: z.string().url("Invalid YouTube URL"),
  duration: z.string().optional(),
});

export const docBlockSchema = z.object({
  type: z.literal("doc"),
  title: z.string().min(1, "Document title is required"),
  content: z.string().min(1, "Content is required"),
  fileUrl: z.string().url().optional(),
});

export const audioBlockSchema = z.object({
  type: z.literal("audio"),
  title: z.string().min(1, "Audio title is required"),
  audioUrl: z.string().url("Invalid audio URL"),
  transcript: z.string().optional(),
  duration: z.string().optional(),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  videoBlockSchema,
  docBlockSchema,
  audioBlockSchema,
]);

export const courseSchema = z
  .discriminatedUnion("type", [
    videoBlockSchema.extend({
      type: z.literal("video"),
      description: z.string(),
      thumbnail: z.string().url().optional(),
    }),
    docBlockSchema.extend({ type: z.literal("doc"), description: z.string() }),
    audioBlockSchema.extend({
      type: z.literal("audio"),
      description: z.string(),
    }),
    z.object({
      type: z.literal("mixed"),
      title: z.string().min(1, "Course title is required"),
      description: z.string().min(1, "Description is required"),
      modules: z
        .array(contentBlockSchema)
        .min(1, "At least one module is required"),
    }),
  ])
  .and(
    z.object({
      status: z.enum(["draft", "published", "archived"]).default("draft"),
      difficulty: z
        .enum(["beginner", "intermediate", "advanced"])
        .default("beginner"),
      tags: z.array(z.string()).default([]),
      slug: z.string().min(3),
      isFeatured: z.boolean().default(false),
    }),
  );

export type CourseFormData = z.infer<typeof courseSchema>;
export type CourseType = CourseFormData["type"];

export type CourseVideoType = z.infer<typeof videoBlockSchema>;
export type CourseDocType = z.infer<typeof docBlockSchema>;
export type CourseAudioType = z.infer<typeof audioBlockSchema>;
export type CourseContentBlock = z.infer<typeof contentBlockSchema>;

export type Course = CourseFormData & {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};
