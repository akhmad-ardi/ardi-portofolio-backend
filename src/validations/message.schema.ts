import * as z from 'zod';

export const messageSchema = z.object({
  name: z.string().nonempty({ error: "name is required" }),
  email: z.email({ error: "email invalid" }).nonempty({ error: "email is required" }),
  phone_number: z.string().nonempty({ error: "phone number is required" }),
  message: z.string().nonempty({ error: "message is required" }),
})
