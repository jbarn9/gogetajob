FROM node:21
# where I work
WORKDIR /usr/src/public
# copy all packages in directory where I work
COPY ./firebase/package*.json ./
RUN npm install
# copy all that I installed in root dir
COPY . .
# specify port
EXPOSE 3000