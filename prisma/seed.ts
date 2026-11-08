import { PrismaClient } from "@prisma/client";
import { seedTinHocDemoData } from "../src/lib/tin-hoc-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting EDUCARE AI Phase 2.5 Idempotent Seed for UNIGO...");

  // 1. Seed 6 System Roles (Section IV)
  const rolesData = [
    {
      code: "SUPER_ADMIN",
      name: "Super Admin (Quản trị tối cao)",
      description: "Toàn quyền điều hành hệ thống, cấu hình OAuth, AI, phân quyền và Multi-View Switcher.",
    },
    {
      code: "SCHOOL_ADMIN",
      name: "Quản trị Nhà trường / Tổ chuyên môn",
      description: "Quản lý năm học, lớp học, môn học, danh sách giáo viên/học sinh và báo cáo cấp trường.",
    },
    {
      code: "TEACHER",
      name: "Giáo viên",
      description: "Quản lý lớp được phân công, biên soạn bài giảng, giao bài, chấm rubric và đồng bộ Google Workspace.",
    },
    {
      code: "STUDENT",
      name: "Học sinh",
      description: "Học tập, làm bài, tự đánh giá, sử dụng AI Tutor / Prompt Lab và xây dựng hồ sơ năng lực.",
    },
    {
      code: "PARENT",
      name: "Phụ huynh",
      description: "Theo dõi tiến độ học tập, điểm số và nhận xét chính thức của con đã xác minh liên kết.",
    },
    {
      code: "COMMUNITY_USER",
      name: "Thành viên Cộng đồng",
      description: "Xem học liệu công khai đã xuất bản và gửi bài đóng góp chờ kiểm duyệt.",
    },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const saved = await prisma.roleDefinition.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roleMap[r.code] = saved.id;
  }

  // 2. Seed Permissions & RolePermission Matrix
  const permissionsData = [
    { code: "system:full_control", resource: "SYSTEM", action: "ALL", description: "Toàn quyền quản trị hệ thống và cấu hình bảo mật" },
    { code: "system:multi_view", resource: "SYSTEM", action: "VIEW_SWITCH", description: "Chuyển đổi góc nhìn 4 vai trò (Multi-View Switcher)" },
    { code: "users:manage", resource: "USER", action: "MANAGE", description: "Quản lý tài khoản, nhập Excel và phân quyền người dùng" },
    { code: "classes:manage", resource: "CLASS", action: "MANAGE", description: "Quản lý năm học, khối, lớp và phân công giáo viên" },
    { code: "lessons:write", resource: "LESSON", action: "WRITE", description: "Soạn giảng, gắn Google Docs/Drive và xuất bản bài học" },
    { code: "assignments:write", resource: "ASSIGNMENT", action: "WRITE", description: "Tạo bài tập, gắn Rubric và đồng bộ Google Classroom/Calendar" },
    { code: "grades:write", resource: "GRADE", action: "WRITE", description: "Chấm bài, duyệt gợi ý AI và xuất bảng điểm Google Sheets" },
    { code: "submissions:create", resource: "SUBMISSION", action: "CREATE", description: "Làm bài, nộp sản phẩm và tự đánh giá theo Rubric" },
    { code: "parent:read_linked_child", resource: "STUDENT_REPORT", action: "READ", description: "Xem tiến độ và nhận xét chính thức của con được liên kết" },
    { code: "community:moderate", resource: "COMMUNITY", action: "MODERATE", description: "Kiểm duyệt bài đăng cộng đồng và thư viện Prompt" },
    { code: "audit:read", resource: "AUDIT_LOG", action: "READ", description: "Xem nhật ký bảo mật, đăng nhập và đồng bộ hệ thống" },
  ];

  const permMap: Record<string, string> = {};
  for (const p of permissionsData) {
    const saved = await prisma.permission.upsert({
      where: { code: p.code },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
    permMap[p.code] = saved.id;
  }

  const rolePermissionsConfig: Record<string, string[]> = {
    SUPER_ADMIN: Object.keys(permMap),
    SCHOOL_ADMIN: ["users:manage", "classes:manage", "community:moderate", "audit:read"],
    TEACHER: ["lessons:write", "assignments:write", "grades:write", "community:moderate"],
    STUDENT: ["submissions:create"],
    PARENT: ["parent:read_linked_child"],
    COMMUNITY_USER: [],
  };

  for (const [roleCode, pCodes] of Object.entries(rolePermissionsConfig)) {
    const rId = roleMap[roleCode];
    for (const pCode of pCodes) {
      const pId = permMap[pCode];
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rId, permissionId: pId } },
        update: {},
        create: { roleId: rId, permissionId: pId },
      });
    }
  }

  // 3. Seed Super Admin: dinhnguyenhnue@gmail.com (Section III)
  const superAdmin = await prisma.user.upsert({
    where: { email: "dinhnguyenhnue@gmail.com" },
    update: {
      role: "SUPER_ADMIN",
      mfaRecommended: true,
    },
    create: {
      email: "dinhnguyenhnue@gmail.com",
      fullName: "Đinh Nguyên (Super Admin UNIGO)",
      role: "SUPER_ADMIN",
      accountStatus: "PENDING_ACTIVATION",
      emailVerified: false,
      isVerified: true,
      isActive: true,
      mfaRecommended: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: roleMap["SUPER_ADMIN"] } },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: roleMap["SUPER_ADMIN"],
      assignedBy: "SYSTEM_SEED",
    },
  });

  // 4. Seed School Admin
  const schoolAdmin = await prisma.user.upsert({
    where: { email: "admin@unigo.edu.vn" },
    update: { role: "SCHOOL_ADMIN", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "admin@unigo.edu.vn",
      fullName: "Nguyễn Văn Quản Trị",
      role: "SCHOOL_ADMIN",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: schoolAdmin.id, roleId: roleMap["SCHOOL_ADMIN"] } },
    update: {},
    create: {
      userId: schoolAdmin.id,
      roleId: roleMap["SCHOOL_ADMIN"],
      assignedBy: "SYSTEM_SEED",
    },
  });

  // 5. Academic Year 2026-2027
  const year2026 = await prisma.academicYear.upsert({
    where: { name: "2026-2027" },
    update: { isCurrent: true },
    create: {
      name: "2026-2027",
      startYear: 2026,
      endYear: 2027,
      isCurrent: true,
    },
  });

  // 6. Teachers
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "thay.tuan@unigo.edu.vn" },
    update: { role: "TEACHER", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "thay.tuan@unigo.edu.vn",
      fullName: "Thầy Trần Minh Tuấn",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacherProfile1 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser1.id },
    update: { specialization: "Tin học & Công nghệ số" },
    create: {
      userId: teacherUser1.id,
      teacherCode: "GV-TIN-01",
      specialization: "Tin học & Công nghệ số",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: teacherUser1.id, roleId: roleMap["TEACHER"] } },
    update: {},
    create: { userId: teacherUser1.id, roleId: roleMap["TEACHER"], assignedBy: "SYSTEM_SEED" },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: { email: "co.lan@unigo.edu.vn" },
    update: { role: "TEACHER", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "co.lan@unigo.edu.vn",
      fullName: "Cô Hoàng Mai Lan",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacherProfile2 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser2.id },
    update: { specialization: "Toán học THCS" },
    create: {
      userId: teacherUser2.id,
      teacherCode: "GV-TOAN-01",
      specialization: "Toán học THCS",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: teacherUser2.id, roleId: roleMap["TEACHER"] } },
    update: {},
    create: { userId: teacherUser2.id, roleId: roleMap["TEACHER"], assignedBy: "SYSTEM_SEED" },
  });

  const teacherUser3 = await prisma.user.upsert({
    where: { email: "co.ha@unigo.edu.vn" },
    update: { role: "TEACHER", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "co.ha@unigo.edu.vn",
      fullName: "Cô Phạm Thu Hà",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const teacherProfile3 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser3.id },
    update: { specialization: "Ngữ văn THCS" },
    create: {
      userId: teacherUser3.id,
      teacherCode: "GV-VAN-01",
      specialization: "Ngữ văn THCS",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: teacherUser3.id, roleId: roleMap["TEACHER"] } },
    update: {},
    create: { userId: teacherUser3.id, roleId: roleMap["TEACHER"], assignedBy: "SYSTEM_SEED" },
  });

  // 7. Classes (Idempotent upsert by [name, academicYearId])
  // Clean up any duplicate classes first if created in Phase 1
  const existingClasses = await prisma.schoolClass.findMany({ where: { academicYearId: year2026.id } });
  const seenClassNames = new Set<string>();
  for (const c of existingClasses) {
    if (seenClassNames.has(c.name)) {
      await prisma.schoolClass.delete({ where: { id: c.id } }).catch(() => {});
    } else {
      seenClassNames.add(c.name);
    }
  }

  const class6A1 = await prisma.schoolClass.upsert({
    where: { name_academicYearId: { name: "6A1", academicYearId: year2026.id } },
    update: { homeroomTeacherId: teacherProfile2.id, gradeLevel: 6 },
    create: { name: "6A1", gradeLevel: 6, academicYearId: year2026.id, homeroomTeacherId: teacherProfile2.id },
  });

  const class7A1 = await prisma.schoolClass.upsert({
    where: { name_academicYearId: { name: "7A1", academicYearId: year2026.id } },
    update: { homeroomTeacherId: teacherProfile1.id, gradeLevel: 7 },
    create: { name: "7A1", gradeLevel: 7, academicYearId: year2026.id, homeroomTeacherId: teacherProfile1.id },
  });

  const class8A1 = await prisma.schoolClass.upsert({
    where: { name_academicYearId: { name: "8A1", academicYearId: year2026.id } },
    update: { homeroomTeacherId: teacherProfile3.id, gradeLevel: 8 },
    create: { name: "8A1", gradeLevel: 8, academicYearId: year2026.id, homeroomTeacherId: teacherProfile3.id },
  });

  // 8. Students & Enrollments
  const studentUser1 = await prisma.user.upsert({
    where: { email: "minhanh.nguyen@unigo.edu.vn" },
    update: { role: "STUDENT", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "minhanh.nguyen@unigo.edu.vn",
      fullName: "Nguyễn Minh Anh",
      role: "STUDENT",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  const studentProfile1 = await prisma.studentProfile.upsert({
    where: { userId: studentUser1.id },
    update: { classId: class7A1.id, gradeLevel: 7 },
    create: {
      userId: studentUser1.id,
      studentCode: "HS2026-0701",
      gradeLevel: 7,
      classId: class7A1.id,
      dateOfBirth: "2014-05-12",
      gender: "Nữ",
      learningGoals: "Thành thạo lập trình Scratch, biết trực quan hóa dữ liệu và tự tin phản biện bài học.",
      aiConfig: JSON.stringify({
        tone: "inquisitive",
        preferredHelpStyle: "guiding_questions",
        weakTopics: ["Phân tích dữ liệu nâng cao"],
      }),
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: studentUser1.id, roleId: roleMap["STUDENT"] } },
    update: {},
    create: { userId: studentUser1.id, roleId: roleMap["STUDENT"], assignedBy: "SYSTEM_SEED" },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_classId_academicYearId: {
        studentId: studentProfile1.id,
        classId: class7A1.id,
        academicYearId: year2026.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      studentId: studentProfile1.id,
      classId: class7A1.id,
      academicYearId: year2026.id,
      status: "ACTIVE",
    },
  });

  const studentUser2 = await prisma.user.upsert({
    where: { email: "giabao.tran@unigo.edu.vn" },
    update: { role: "STUDENT", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "giabao.tran@unigo.edu.vn",
      fullName: "Trần Gia Bảo",
      role: "STUDENT",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  const studentProfile2 = await prisma.studentProfile.upsert({
    where: { userId: studentUser2.id },
    update: { classId: class7A1.id, gradeLevel: 7 },
    create: {
      userId: studentUser2.id,
      studentCode: "HS2026-0702",
      gradeLevel: 7,
      classId: class7A1.id,
      dateOfBirth: "2014-08-21",
      gender: "Nam",
      learningGoals: "Xây dựng website cá nhân và đạt học sinh giỏi Tin học.",
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: studentUser2.id, roleId: roleMap["STUDENT"] } },
    update: {},
    create: { userId: studentUser2.id, roleId: roleMap["STUDENT"], assignedBy: "SYSTEM_SEED" },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_classId_academicYearId: {
        studentId: studentProfile2.id,
        classId: class7A1.id,
        academicYearId: year2026.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      studentId: studentProfile2.id,
      classId: class7A1.id,
      academicYearId: year2026.id,
      status: "ACTIVE",
    },
  });

  // 9. Parent & Verified ParentStudent link
  const parentUser = await prisma.user.upsert({
    where: { email: "ph.minhanh@gmail.com" },
    update: { role: "PARENT", accountStatus: "ACTIVE", emailVerified: true },
    create: {
      email: "ph.minhanh@gmail.com",
      fullName: "Nguyễn Quang Huy (Phụ huynh)",
      role: "PARENT",
      accountStatus: "ACTIVE",
      emailVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id, phone: "0912345678" },
  });

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId: parentUser.id, roleId: roleMap["PARENT"] } },
    update: {},
    create: { userId: parentUser.id, roleId: roleMap["PARENT"], assignedBy: "SYSTEM_SEED" },
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parentProfile.id,
        studentId: studentProfile1.id,
      },
    },
    update: { isVerified: true },
    create: {
      parentId: parentProfile.id,
      studentId: studentProfile1.id,
      relationship: "CHA",
      isVerified: true,
    },
  });

  // 10. Subjects
  const subjectTin7 = await prisma.subject.upsert({
    where: { code: "TIN7" },
    update: { name: "Tin học & Công nghệ số", gradeLevel: 7 },
    create: { name: "Tin học & Công nghệ số", code: "TIN7", gradeLevel: 7 },
  });

  const subjectToan7 = await prisma.subject.upsert({
    where: { code: "TOAN7" },
    update: { name: "Toán học", gradeLevel: 7 },
    create: { name: "Toán học", code: "TOAN7", gradeLevel: 7 },
  });

  const subjectVan7 = await prisma.subject.upsert({
    where: { code: "VAN7" },
    update: { name: "Ngữ văn", gradeLevel: 7 },
    create: { name: "Ngữ văn", code: "VAN7", gradeLevel: 7 },
  });

  // 11. LearningProgress records (Real DB backing for student & parent progress bars)
  await prisma.learningProgress.upsert({
    where: { studentId_subjectId: { studentId: studentProfile1.id, subjectId: subjectTin7.id } },
    update: {
      masteryPercent: 92,
      completedLessons: 2,
      completedAssignments: 1,
      strengths: "Rất sáng tạo trong thiết kế sản phẩm số (Infographic đạt 9.0/10); có thói quen tự đánh giá khách quan.",
      gaps: "Cần bổ sung thêm trích dẫn nguồn tài liệu tham khảo khi làm dự án.",
      nextStepSuggestion: "Chuyển hóa sản phẩm Infographic thành bài chia sẻ trên Cộng đồng học tập UNIGO.",
    },
    create: {
      studentId: studentProfile1.id,
      subjectId: subjectTin7.id,
      masteryPercent: 92,
      completedLessons: 2,
      completedAssignments: 1,
      strengths: "Rất sáng tạo trong thiết kế sản phẩm số (Infographic đạt 9.0/10); có thói quen tự đánh giá khách quan.",
      gaps: "Cần bổ sung thêm trích dẫn nguồn tài liệu tham khảo khi làm dự án.",
      nextStepSuggestion: "Chuyển hóa sản phẩm Infographic thành bài chia sẻ trên Cộng đồng học tập UNIGO.",
    },
  });

  await prisma.learningProgress.upsert({
    where: { studentId_subjectId: { studentId: studentProfile1.id, subjectId: subjectToan7.id } },
    update: {
      masteryPercent: 78,
      completedLessons: 1,
      completedAssignments: 0,
      strengths: "Nắm vững định nghĩa tỉ lệ thức cơ bản.",
      gaps: "Cần rèn luyện thêm bài toán tỉ lệ thức dạng chia phần thực tế.",
      nextStepSuggestion: "Hoàn thành bài tập thực hành phân chia kinh phí CLB trước hạn nộp.",
    },
    create: {
      studentId: studentProfile1.id,
      subjectId: subjectToan7.id,
      masteryPercent: 78,
      completedLessons: 1,
      completedAssignments: 0,
      strengths: "Nắm vững định nghĩa tỉ lệ thức cơ bản.",
      gaps: "Cần rèn luyện thêm bài toán tỉ lệ thức dạng chia phần thực tế.",
      nextStepSuggestion: "Hoàn thành bài tập thực hành phân chia kinh phí CLB trước hạn nộp.",
    },
  });

  await prisma.learningProgress.upsert({
    where: { studentId_subjectId: { studentId: studentProfile1.id, subjectId: subjectVan7.id } },
    update: {
      masteryPercent: 85,
      completedLessons: 1,
      completedAssignments: 1,
      strengths: "Kỹ năng lập luận rõ ràng, bố cục bài viết mạch lạc.",
      gaps: "Cần mở rộng thêm dẫn chứng đời sống thực tế.",
      nextStepSuggestion: "Thảo luận cùng gia đình hoặc AI Tutor để tìm các ví dụ thực tiễn.",
    },
    create: {
      studentId: studentProfile1.id,
      subjectId: subjectVan7.id,
      masteryPercent: 85,
      completedLessons: 1,
      completedAssignments: 1,
      strengths: "Kỹ năng lập luận rõ ràng, bố cục bài viết mạch lạc.",
      gaps: "Cần mở rộng thêm dẫn chứng đời sống thực tế.",
      nextStepSuggestion: "Thảo luận cùng gia đình hoặc AI Tutor để tìm các ví dụ thực tiễn.",
    },
  });

  // 12. Sync Grades from existing graded submissions
  const gradedSubs = await prisma.submission.findMany({
    where: { status: "GRADED", score: { not: null } },
    include: { assignment: true },
  });

  for (const sub of gradedSubs) {
    const existingGrade = await prisma.grade.findFirst({
      where: { submissionId: sub.id },
    });
    if (!existingGrade && sub.score !== null) {
      await prisma.grade.create({
        data: {
          studentId: sub.studentId,
          subjectId: sub.assignment.subjectId,
          academicYearId: year2026.id,
          assignmentId: sub.assignmentId,
          submissionId: sub.id,
          score: sub.score,
          maxScore: sub.assignment.maxScore,
          gradeType: sub.assignment.type,
          gradedBy: sub.gradedBy || "Thầy Trần Minh Tuấn",
          feedback: sub.teacherComment,
        },
      });
    }
  }

  // 13. Initial Audit Log entry
  const existingBootAudit = await prisma.auditLog.findFirst({
    where: { action: "SUPER_ADMIN_PROVISIONED" },
  });

  if (!existingBootAudit) {
    await prisma.auditLog.create({
      data: {
        actorId: superAdmin.id,
        actorEmail: "dinhnguyenhnue@gmail.com",
        actorRole: "SUPER_ADMIN",
        action: "SUPER_ADMIN_PROVISIONED",
        resource: "USER_ROLE",
        resourceId: superAdmin.id,
        status: "SUCCESS",
        details: JSON.stringify({
          message: "Khởi tạo tài khoản Super Admin dinhnguyenhnue@gmail.com qua seed có kiểm soát. Trạng thái chờ xác thực Google OIDC.",
          mfaRecommended: true,
        }),
      },
    });
  }

  // 14. Seed CỔNG HỌC TẬP TIN HỌC – XƯỞNG SÁNG TẠO TRÒ CHƠI (TIN HỌC SÁNG TẠO) Pilot Class 7A1 Demo Data
  const tinHocResult = await seedTinHocDemoData(prisma);
  console.log("Tin Hoc Sang Tao pilot seed:", tinHocResult);

  console.log("Seed completed successfully! Super Admin dinhnguyenhnue@gmail.com & RBAC ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
