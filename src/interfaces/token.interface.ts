import { JwtPayload } from "jsonwebtoken";
import { Roles } from "../enums";



export interface TokenPayload extends JwtPayload {
    id: string;
    role: Roles;
    iat: number;
    exp: number;
}