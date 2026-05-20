import z from "zod";

const videoContentSchema = z.object({
  type: z.literal("video"),
  title: z.string().min(1, "Video title is required"),
  youtubeUrl: z.string().url("Invalid YouTube URL"),
  duration: z.string().optional(),
});

const docContentSchema = z.object({
  type: z.literal("doc"),
  title: z.string().min(1, "Document title is required"),
  content: z.string().min(1, "Content is required"),
  file: z.instanceof(File).optional(),
  fileUrl: z.string().optional(),
});

const audioContentSchema = z.object({
  type: z.literal("audio"),
  title: z.string().min(1, "Audio title is required"),
  audioUrl: z.string().url("Invalid audio URL"),
  transcript: z.string().optional(),
});

const contentBlockSchema = z.discriminatedUnion("type", [
  videoContentSchema,
  docContentSchema,
  audioContentSchema,
]);

export const courseSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("doc"),
      title: z.string().min(1, "Title is required"),
      description: z.string().min(1, "Description is required"),
      content: z.string().min(1, "Content is required"),
      fileUrl: z.string().url().optional().or(z.literal("")),
    }),
    z.object({
      type: z.literal("video"),
      title: z.string().min(1, "Title is required"),
      duration: z.string().optional(),
      description: z.string().min(1, "Description is required"),
      youtubeUrl: z.string().url("Invalid YouTube URL"),
      thumbnail: z.string().url().optional(),
    }),
    z.object({
      type: z.literal("audio"),
      title: z.string().min(1, "Title is required"),
      duration: z.string().optional(),
      description: z.string().min(1, "Description is required"),
      audioUrl: z.string().url("Invalid audio URL"),
      transcript: z.string().optional(),
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
      isFeatured: z.boolean().default(false),
    }),
  );

export type CourseFormData = z.infer<typeof courseSchema>;
export type CourseType = CourseFormData["type"];
export type CourseContentBlock = z.infer<typeof contentBlockSchema>;

export type Course = CourseFormData & {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};
