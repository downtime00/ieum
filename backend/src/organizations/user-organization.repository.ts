import { Injectable } from '@nestjs/common';

@Injectable()
export class UserOrganizationRepository {
  /**
   * 조직 ID 로 연결된 사용자와 조직 목록 조회 (임시: 조직 삭제 방지용)
   */
  async findByOrgId(organizationId: number): Promise<any[]> {
    // TODO: 실제 구현 - user-organization 테이블 조회
    return [];
  }

  /**
   * 사용자 연결
   */
  async connect(userId: number, organizationId: number): Promise<void> {
    // TODO: 실제 구현
  }

  /**
   * 사용자 연결 해제
   */
  async disconnect(userId: number, organizationId: number): Promise<void> {
    // TODO: 실제 구현
  }
}
