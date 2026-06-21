export class TokenExpiredError extends Error{
    constructor(message){
        super(message);

        this.name = "TokenExpiredError";
    }
}

export class UnauthorizedError extends Error{
    constructor(message){
        super(message);

        this.name = "UnautorizedError";
    }
}