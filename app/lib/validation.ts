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

export const wechatLoginSchema = z.object({
  code: z.string().min(4, "微信登录参数无效"),
})

export type WechatLoginSchema = z.infer<typeof wechatLoginSchema>

export const wechatBindSchema = z.object({
  token: z.string().min(10, "登录状态已失效，请重新登录"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码长度必须大于等于8位"),
  code: z.string().min(6).max(8).optional(),
})

export type WechatBindSchema = z.infer<typeof wechatBindSchema>

export const wechatRegisterSchema = z.object({
  token: z.string().min(10, "登录状态已失效，请重新登录"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码长度必须大于等于8位"),
  code: z.string().min(6).max(8).optional(),
})

export type WechatRegisterSchema = z.infer<typeof wechatRegisterSchema>

export const userEmailSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入当前密码"),
  code: z.string().min(6).max(8).optional(),
})

export type UserEmailSchema = z.infer<typeof userEmailSchema>

export const userEmailSendCodeSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入当前密码"),
})

export type UserEmailSendCodeSchema = z.infer<typeof userEmailSendCodeSchema>

export const userProfileSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少需要 2 个字符")
    .max(30, "用户名不能超过 30 个字符")
    .refine((value) => !/\s/.test(value), "用户名不能包含空格"),
})

export type UserProfileSchema = z.infer<typeof userProfileSchema>
