import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { env } from 'hono/adapter'
import { zValidator } from '@hono/zod-validator'
import { cors } from "hono/cors";
import axios from 'axios'
import { messageSchema } from './validations/message.schema'

const app = new Hono()

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get('/', (c) => {
  return c.text('Hello World!')
})

app.post('/message', 
  zValidator('json', messageSchema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.reduce(
        (acc, issue) => {
          const field = issue.path[0] as string;

          acc[field] = issue.message;

          return acc;
        },
        {} as Record<string, string>
      )

      return c.json(
        {
          success: false,
          errors,
        },
        400
      )
    }
  }), 
  async (c) => {
    const { TOKEN_TELEGRAM_BOT, CHAT_ID } = env<{ TOKEN_TELEGRAM_BOT: string; CHAT_ID: string }>(c, 'workerd')

    if (!TOKEN_TELEGRAM_BOT || !CHAT_ID) {  
      throw new HTTPException(500, { message: 'something error' })
    }
        
    const data = c.req.valid('json')

    const res = await axios.post(`https://api.telegram.org/bot${TOKEN_TELEGRAM_BOT}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `
Ada pesan dari ${data.name}
email: ${data.email}
phone number: ${data.phone_number}

${data.message}
      `
    })

    return c.json({
      success: true,
      message: 'Thank You for Your Message'
    })
  }
)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      success: false,
      message: err.message
    }, err.status)
  }
  
  console.error(err)
  return c.json({ message: 'Internal Server Error' }, 500)
})

export default app
