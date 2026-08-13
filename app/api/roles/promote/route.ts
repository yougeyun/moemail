import { createDb } from "@/lib/db";
import { roles, userRoles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PERMISSIONS, ROLES } from "@/lib/permissions";
import { assignRoleToUser, checkPermission } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const canPromote = await checkPermission(PERMISSIONS.PROMOTE_USER)
    if (!canPromote) {
      return Response.json({ error: "权限不足" }, { status: 403 })
    }

    const { userId, roleId } = await request.json() as {
      userId: string,
      roleId: string,
    };
    if (!userId || !roleId) {
      return Response.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const db = createDb();

    const currentUserRole = await db.query.userRoles.findFirst({
      where: eq(userRoles.userId, userId),
      with: {
        role: true,
      },
    });

    if (currentUserRole?.role.name === ROLES.EMPEROR) {
      return Response.json(
        { error: "不能降级皇帝" },
        { status: 400 }
      );
    }

    const targetRole = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!targetRole) {
      return Response.json({ error: "角色不存在" }, { status: 404 });
    }

    if (targetRole.name === ROLES.EMPEROR) {
      return Response.json(
        { error: "不能将用户设置为皇帝" },
        { status: 400 }
      );
    }

    await assignRoleToUser(db, userId, targetRole.id);

    return Response.json({ 
      success: true,
    });
  } catch (error) {
    console.error("Failed to change user role:", error);
    return Response.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
