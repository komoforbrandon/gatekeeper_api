import bcrypt from "bcryptjs";

export function hashPassword (password) {
    const hashpassword = bcrypt.hashSync(password, 10);
    return hashpassword
}

export function verifyPassword (password, hashpassword) {
    const isValid = bcrypt.compareSync(password, hashpassword);
    return isValid
}