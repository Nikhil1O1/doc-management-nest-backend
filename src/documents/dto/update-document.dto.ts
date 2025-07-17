import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(
  OmitType(CreateDocumentDto, [
    'fileName',
    'filePath',
    'mimeType',
    'fileSize',
    'checksum',
    'uploadedById',
  ] as const)
) {} 