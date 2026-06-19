export class TokenExpiredError extends Error{
    constructor(message){
        super(message);

        this.name = "TokenExpiredError";
    }
}

export class UnautorizedError extends Error{
    constructor(message){
        super(message);

        this.name = "UnautorizedError";
    }
}