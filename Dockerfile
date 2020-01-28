FROM node:10-jessie AS build
LABEL maintainer="Filip Muki Dobranić <filip@danesjenovdan.si>"

ENV DEBIAN_FRONTEND noninteractive

################################################################################
#
#     Source processing
#
################################################################################

RUN mkdir -p /browser
COPY . /browser

################################################################################
#
#     Build frontend
#
################################################################################

# RUN npm install -g yarn
WORKDIR /browser
RUN yarn
# RUN yarn start
RUN yarn build

################################################################################
#
#     Create server
#
################################################################################

FROM nginx:1.15-alpine AS deploy

COPY --from=build /browser/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
