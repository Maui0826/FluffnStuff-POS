import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

function isAlphaWithSpaces(str) {
  return str.split(' ').every(word => validator.isAlpha(word, 'en-US'));
}

//UserModel
const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
      required: [true, 'Email is required'],
      unique: [true, 'Email is already in use'],
    },
    name: {
      firstName: {
        type: String,
        trim: true,
        required: [true, 'First name is required'],
        minlength: [2, 'First name must be at least 2 characters'],
        validate: [isAlphaWithSpaces, 'First name must contain letters only'],
      },
      middleName: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // allow empty
            return validator.isAlpha(v);
          },
          message: 'Middle name must contain letters only',
        },
      },
      lastName: {
        type: String,
        trim: true,
        required: [true, 'Last name is required'],
        minlength: [2, 'Last name must be at least 2 characters'],
        validate: [isAlphaWithSpaces, 'Last name must contain letters only'],
      },
    },
    role: {
      type: String,
      enum: ['admin', 'owner', 'cashier', 'inventory'],
      required: [true, 'Must have a role'],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ['banned', 'suspended', 'active'],
      default: 'active',
    },
    suspendUntil: {
      type: Date,
    },

    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const lastPasswordChange = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < lastPasswordChange;
  }
  return false;
};

const user = mongoose.model('User', userSchema);

export default user;
