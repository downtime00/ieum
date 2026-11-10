# Nginx 로드밸런서 컨테이너용 이미지
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 80 개방 (HTTP 리디렉션 없이)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]