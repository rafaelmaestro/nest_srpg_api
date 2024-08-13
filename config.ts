import { configDotenv } from 'dotenv'

export function setEnv(aEnvi?: string) {
    if (aEnvi) {
        configDotenv({ path: aEnvi })
    } else {
        configDotenv({ path: './.env' })
    }
}
