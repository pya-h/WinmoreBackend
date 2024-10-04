import { Test, TestingModule } from '@nestjs/testing';
import { BlockAnalyzerService } from './block-analyzer.service';

describe('BlockAnalyzerService', () => {
  let service: BlockAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockAnalyzerService],
    }).compile();

    service = module.get<BlockAnalyzerService>(BlockAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
