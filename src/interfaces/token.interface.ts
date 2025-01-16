import { JwtPayload } from "jsonwebtoken";



export interface TokenPayload extends JwtPayload {
    id: string;
    role: string;
    iat: number;
    exp: number;
}