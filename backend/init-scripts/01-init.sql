-- PostgreSQL 초기화 스크립트
-- 데이터베이스 기본 설정 및 확장 설치

-- UTF-8 인코딩 설정 확인
SELECT current_setting('server_encoding') AS server_encoding,
       current_setting('client_encoding') AS client_encoding,
       current_setting('lc_collate') AS lc_collate,
       current_setting('lc_ctype') AS lc_ctype;

-- 필요한 확장 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 텍스트 검색 최적화
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- 악센트 제거
