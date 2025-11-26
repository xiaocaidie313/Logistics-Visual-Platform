import express from 'express'
import loginRouter from './login.js'


const router  = express.Router()

router.use('/', loginRouter)

export default router 