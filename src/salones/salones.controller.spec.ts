import { Test, TestingModule } from '@nestjs/testing';
import { SalonesController } from './salones.controller';

describe('SalonesController', () => {
  let controller: SalonesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalonesController],
    }).compile();

    controller = module.get<SalonesController>(SalonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
