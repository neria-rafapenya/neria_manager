FROM eclipse-temurin:17-jre

RUN apt-get update \
    && apt-get install -y tesseract-ocr tesseract-ocr-spa tesseract-ocr-cat tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY target/*.jar app.jar

ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata
ENV TESSERACT_LANG=spa+cat+eng

EXPOSE 3000
ENTRYPOINT ["java","-jar","/app/app.jar"]
