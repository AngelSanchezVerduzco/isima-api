import { Test, TestingModule } from '@nestjs/testing';
import { CalendarioController } from './calendario.controller';

describe('CalendarioController', () => {
  let controller: CalendarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarioController],
    }).compile();

    controller = module.get<CalendarioController>(CalendarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
