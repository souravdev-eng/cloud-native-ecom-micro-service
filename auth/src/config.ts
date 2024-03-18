class Config {
    public NODE_ENV: string | undefined;
    public DB_URL: string | undefined;
    public RABBITMQ_ENDPOINT: string | undefined;
<<<<<<< HEAD
=======
    public EMAIL_USER: string | undefined;
    public EMAIL_APP_PASSWORD: string | undefined;
>>>>>>> 4e85ca3e6933b05cb3e978c54cb24826221546b5

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.DB_URL = process.env.DB_URL || '';
        this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
<<<<<<< HEAD
=======
        this.EMAIL_USER = process.env.EMAIL_USER || '';
        this.EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';
>>>>>>> 4e85ca3e6933b05cb3e978c54cb24826221546b5
    }
}

export const config: Config = new Config()