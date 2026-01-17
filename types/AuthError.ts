export class AuthError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status: number,
    public readonly errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "AuthError";
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
