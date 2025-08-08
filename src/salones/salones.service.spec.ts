import { Test, TestingModule } from '@nestjs/testing';
import { SalonesService } from './salones.service';

describe('SalonesService', () => {
  let service: SalonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalonesService],
    }).compile();

    service = module.get<SalonesService>(SalonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
