import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const signupSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
