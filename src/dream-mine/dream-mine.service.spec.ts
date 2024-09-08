import { Test, TestingModule } from '@nestjs/testing';
import { DreamMineService } from './dream-mine.service';

describe('DreamMineService', () => {
  let service: DreamMineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DreamMineService],
    }).compile();

    service = module.get<DreamMineService>(DreamMineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
