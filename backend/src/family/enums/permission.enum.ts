export enum Permission {
  FAMILY_CREATE = 'FAMILY_CREATE',      // 가족 생성
  FAMILY_READ = 'FAMILY_READ',          // 가족 조회
  FAMILY_UPDATE = 'FAMILY_UPDATE',      // 가족 정보 수정
  FAMILY_DELETE = 'FAMILY_DELETE',      // 가족 삭제
  MEMBER_INVITE = 'MEMBER_INVITE',      // 가족 구성원 초대
  MEMBER_JOIN = 'MEMBER_JOIN',          // 가족 가입 (초대 코드 사용)
  MEMBER_ADD = 'MEMBER_ADD',            // 새 구성원 추가
  MEMBER_REMOVE = 'MEMBER_REMOVE',      // 구성원 제거
  INVITE_CODE_GENERATE = 'INVITE_CODE_GENERATE', // 초대 코드 생성
  ORGANIZATION_CONNECT = 'ORGANIZATION_CONNECT',    // 조직 연결
  PROFILE_SETTING = 'PROFILE_SETTING'       // 프로필 설정
}