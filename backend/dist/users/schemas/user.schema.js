"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcryptjs"));
let User = class User {
    email;
    username;
    password;
    profile;
    stats;
    account;
    following;
    followers;
    isPrivate;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            name: {
                type: String,
                default: '',
                trim: true,
                maxlength: [50, 'Name cannot exceed 50 characters']
            },
            bio: {
                type: String,
                default: '',
                maxlength: [150, 'Bio cannot exceed 150 characters']
            },
            avatar: {
                type: String,
                default: ''
            },
            website: {
                type: String,
                default: '',
                match: [/^https?:\/\/.+\..+$/, 'Please enter a valid website URL']
            },
            gender: {
                type: String,
                enum: ['male', 'female', 'other', 'prefer-not-to-say'],
                default: 'prefer-not-to-say'
            },
            location: {
                type: String,
                default: '',
                maxlength: [50, 'Location cannot exceed 50 characters']
            },
            coverImage: {
                type: String,
                default: ''
            }
        },
        _id: false
    }),
    __metadata("design:type", Object)
], User.prototype, "profile", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            postsCount: { type: Number, default: 0 },
            followersCount: { type: Number, default: 0 },
            followingCount: { type: Number, default: 0 },
            likesCount: { type: Number, default: 0 }
        },
        _id: false
    }),
    __metadata("design:type", Object)
], User.prototype, "stats", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            isEmailVerified: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true },
            lastLogin: { type: Date, default: null },
            role: {
                type: String,
                enum: ['user', 'admin', 'moderator'],
                default: 'user'
            }
        },
        _id: false
    }),
    __metadata("design:type", Object)
], User.prototype, "account", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            type: mongoose_2.Types.ObjectId,
            ref: 'User'
        }]),
    __metadata("design:type", Array)
], User.prototype, "following", void 0);
__decorate([
    (0, mongoose_1.Prop)([{
            type: mongoose_2.Types.ObjectId,
            ref: 'User'
        }]),
    __metadata("design:type", Array)
], User.prototype, "followers", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false
    }),
    __metadata("design:type", Boolean)
], User.prototype, "isPrivate", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
        }
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ 'profile.name': 'text', username: 'text' });
exports.UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        return false;
    }
};
//# sourceMappingURL=user.schema.js.map