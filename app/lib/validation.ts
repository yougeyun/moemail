import { z } from "zod"

export const authSchema = z.object({
  username: z.string()
    .min(1, "请输入用户名或邮箱")
    .max(120, "用户名或邮箱长度不能超过120个字符")
    .refine(val => !/\s/.test(val), "用户名或邮箱不能包含空格"),
  password: z.string()
    .min(8, "密码长度必须大于等于8位"),
  turnstileToken: z.string().optional()
})

export type AuthSchema = z.infer<typeof authSchema>

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码长度必须大于等于8位"),
  code: z.string().min(6).max(8).optional(),
  turnstileToken: z.string().optional(),
})

export type RegisterSchema = z.infer<typeof registerSchema>

export const verificationSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  purpose: z.enum(["register", "bind"]),
  turnstileToken: z.string().optional(),
})

export type VerificationSchema = z.infer<typeof verificationSchema>

export const bindSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码长度必须大于等于8位"),
  code: z.string().min(6).max(8),
  turnstileToken: z.string().optional(),
})

export type BindSchema = z.infer<typeof bindSchema>
