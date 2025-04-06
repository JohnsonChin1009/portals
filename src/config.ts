export interface GoogleOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export class Config {
    private static instance: Config;
    private oauthConfig: GoogleOAuthConfig | null = null;
  
    private constructor() {}
  
    static getInstance(): Config {
      if (!Config.instance) {
        Config.instance = new Config();
      }
      return Config.instance;
    }
  
    setOAuthConfig(config: GoogleOAuthConfig) {
      this.oauthConfig = config;
    }
  
    getOAuthConfig(): GoogleOAuthConfig {
      if (!this.oauthConfig) {
        throw new Error("OAuth Config has not been set. Please call init() first.");
      }
      return this.oauthConfig;
    }
  }