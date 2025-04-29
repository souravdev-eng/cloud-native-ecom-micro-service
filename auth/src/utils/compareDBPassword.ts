import bcrypt from 'bcryptjs';

export const compareDBPassword = async (
    userPassword: string,
    encryptDBPassword: string
): Promise<boolean> => {
    // Ensure bcrypt compares the plain password with the hashed password from DB
    const passwordMatch = await bcrypt.compare(userPassword, encryptDBPassword);
    return passwordMatch;
};
