import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { environment } from 'src/environments/environment';

const poolData = {
  UserPoolId: environment.UserPoolId,
  ClientId: environment.ClientId
};

export const userPool = new CognitoUserPool(poolData);