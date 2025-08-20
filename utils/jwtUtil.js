import jwt from 'jsonwebtoken';

const generateToken = (
  payload,
  expiresIn = process.env.JWT_EXP
) => {
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return token;
};

const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
};

export { generateToken, verifyToken };
