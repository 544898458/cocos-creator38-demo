import { Color, Pool, Quat, Vec2, Vec3 } from "cc";

const tempQuat = new Quat();
const PI_2 = Math.PI * 0.5;
export const vec3Pool = new Pool(()=>new Vec3, 10);
export const vec2Pool = new Pool(()=>new Vec2, 10);
export const colorPool = new Pool(()=>new Color, 10);

export class MathUtils {
    /**
     * 计算垂直向量
     */
    public static calVerticalDirByAxis(out: Vec3, dir: Vec3, axis: Vec3) {
        const q = Quat.fromAxisAngle(tempQuat, axis, PI_2);
        Vec3.transformQuat(out, dir, q);
    }

    public static signValue(a: number) {
        return a >= 0.00001 ? 1 : -1;
    }

    /**
     * 计算两条直线的交点
     * @param p1 
     * @param dir1 
     * @param p2 
     * @param dir2 
     * @param out 
     */
    public static calcCrossPoint(p1: Vec3, dir1: Vec3, p2: Vec3, dir2: Vec3, out: Vec3) {
        const temp = vec3Pool.alloc();
        const temp1 = vec3Pool.alloc();
        Vec3.cross(temp, dir1, dir2);
        Vec3.cross(temp1, dir2, temp);
        Vec3.subtract(temp, p2, p1);
        const t = Vec3.dot(temp1, temp) / Vec3.dot(temp1, dir1);
        Vec3.multiplyScalar(out, dir1, t);
        Vec3.add(out, p1, out);
        vec3Pool.free(temp);
        vec3Pool.free(temp1);

        return out;
    }

    public static signedAngle(a: Vec3, b: Vec3, axis: Vec3) {
        const temp = vec3Pool.alloc();
        Vec3.cross(temp, a, b);
        const angle = Vec3.angle(a, b);
        const sign = Vec3.dot(temp, axis);
        vec3Pool.free(temp);
        return sign >= 0 ? angle : -angle;
    }

    public static slerp(a: Vec3, b: Vec3, axis: Vec3, t: number, out: Vec3) {
        const angle = MathUtils.signedAngle(a, b, axis);
        Quat.fromAxisAngle(tempQuat, axis, angle * t);
        Vec3.transformQuat(out, a, tempQuat);
        return out;
    }
}