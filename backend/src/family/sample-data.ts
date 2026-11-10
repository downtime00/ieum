/**
 * 샘플 가족 데이터 (Role: ADMIN)
 */
export const ADMIN_FAMILY_DATA = {
  families: [
    {
      id: 1,
      name: '김철수 가계',
      description: '최고급 가족 모임',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      adminUser: 10, // ADMIN ID
    },
  ],
  users: [
    {
      id: 10,
      email: 'admin@example.com',
      password: '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJCbNlo/4/.O3DzbXFsZSJK.', // hashed
      name: '김철수',
      role: 'ADMIN',
      families: [1],
    },
  ],
};

/**
 * 샘플 가족 데이터 (Role: HEAD) - 가계원 관리 역할
 */
export const HEAD_FAMILY_DATA = {
  families: [
    {
      id: 2,
      name: '박미영 가계',
      description: '가족 구성원 관리 중심',
      createdAt: new Date('2024-01-15T00:00:00Z'),
      adminUser: 20, // HEAD role
    },
  ],
  users: [
    {
      id: 20,
      email: 'head@example.com',
      password: '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJCbNlo/4/.O3DzbXFsZSJK.', // hashed
      name: '박미영',
      role: 'HEAD',
      families: [2],
      permissions: ['FAMILY_READ', 'FAMILY_UPDATE', 'MEMBER_MANAGE'],
    },
    {
      id: 21,
      email: 'member@example.com',
      password: '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJCbNlo/4/.O3DzbXFsZSJK.', // hashed
      name: '박지민',
      role: 'MEMBER',
      families: [2],
    },
  ],
};

/**
 * 샘플 가족 데이터 (Role: MEMBER) - 일반 구성원
 */
export const MEMBER_FAMILY_DATA = {
  families: [
    {
      id: 3,
      name: '정수빈 가계',
      description: '가족 사진 공유 및 이벤트 관리',
      createdAt: new Date('2024-02-01T00:00:00Z'),
      adminUser: 30, // MEMBER role
    },
  ],
  users: [
    {
      id: 30,
      email: 'member@example.com',
      password: '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJCbNlo/4/.O3DzbXFsZSJK.', // hashed
      name: '정수빈',
      role: 'MEMBER',
      families: [3],
      permissions: ['FAMILY_READ'],
    },
  ],
};
