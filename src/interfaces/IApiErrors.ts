export interface IApiError {
  code: string;
  message: string;
  httpStatusCode: number;
}

type IApiErrorsType = {
  Unexpected: IApiError;
  MethodNotSupported: IApiError;
  MethodNotImplemented: IApiError;
  Forbidden: IApiError;
  UnAuthorized: IApiError;
  BadRequest: IApiError;
  InvalidCredentials: IApiError;
  InvalidParameters: IApiError;
  NoContent: IApiError;
  NotFound: IApiError;
};

export interface IApiErrors extends IApiErrorsType{}
