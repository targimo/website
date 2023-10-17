#include <tesseract/baseapi.h>
#include <leptonica/allheaders.h>

int main()
{
    char *outText;

    tesseract::TessBaseAPI *api = new tesseract::TessBaseAPI();
    // init tesseract-ocr with English
    if (api->Init(NULL, "eng")) {
        fprintf(stderr, "Could not initialize tesseract.\n");
        exit(1);
    }

    // open input image w leptonica library
    Pix *image = pixRead("./sample.png");
    api->SetImage(image);

    // get OCR result
    outText = api->GetUTF8Text();
    printf("OCR output:\n%s", outText);

    // destroy used object and release memory
    api->End();
    delete api;
    delete [] outText;
    pixDestroy(&image);

    return 0;
}