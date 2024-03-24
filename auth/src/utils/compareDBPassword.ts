import bcrypt from 'bcryptjs';

export const compareDBPassword = async (userPassword: string, encryptDBPassword: string): Promise<boolean> => {
    const passwordMatch = await bcrypt.compare(userPassword, encryptDBPassword);

    if (!passwordMatch) {
        return false;
    }

    return true;
}