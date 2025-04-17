import { Injectable } from '@nestjs/common';
import { PlinkoRules } from '@prisma/client';
import {
  BoxBordersType,
  BucketsDataType,
  BucketSpecsType,
  DeterministicPlinkoBallType,
  InitialBallStateType,
  PegCoordinationsType,
  PegsDataType,
  PlinkoBallType,
} from './types/physx.types';

@Injectable()
export class PlinkoPhysxService {
  public static readonly boardOffsets = {
    width: 600,
    height: 200,
  };
  public static readonly bucketOffsetRequiringRows = { 10: -10, 11: 10 };
  public static readonly bucketSpecs: BucketSpecsType = {
    width: 60,
    height: 80,
    widthThreshold: 5,
    heightThreshold: 30,
    cornerRadius: 10,
    topRatio: 1.1,
    bottomRatio: 0.7,
  };

  getBoardSpecs(rows: number) {
    return {
      height: PlinkoPhysxService.boardOffsets.height + (rows - 1) * 50,
      width: PlinkoPhysxService.boardOffsets.width + Math.max(0, rows - 9) * 40,
    };
  }

  getPegs(
    rows: number,
    bucketWidth: number,
    radius: number = 9,
    spacing: number = 50,
    firstRowY: number = 100,
    firstRowPegsCount: number = 3,
  ): PegsDataType {
    const pegs: { x: number; y: number; radius: number }[] = [];
    const halfBoardWidth = this.getBoardSpecs(rows).width / 2;
    let leastLeft = Infinity;
    for (let row = 0; row < rows; row++) {
      const halfRow = row / 2;
      for (let i = 0; i < row + firstRowPegsCount; i++) {
        const x = halfBoardWidth + (i - halfRow) * spacing - bucketWidth;
        if (x < leastLeft) {
          leastLeft = x;
        }
        const y = firstRowY + row * spacing;
        pegs.push({ x, y, radius });
      }
    }
    return {
      coords: pegs,
      borders: {
        leftX: leastLeft,
        rightX: pegs[pegs.length - 1].x,
        topY: firstRowY,
        bottomY: pegs[pegs.length - 1].y,
      },
    };
  }

  getBuckets(
    rule: PlinkoRules,
    offsetBox: BoxBordersType,
    specs = PlinkoPhysxService.bucketSpecs,
  ): BucketsDataType {
    return {
      coords: rule.multipliers.map((multiplier, index) => {
        const topWidth = specs.width * specs.topRatio;
        const bottomWidth = specs.width * specs.bottomRatio;
        const x =
          index * (specs.width + specs.widthThreshold * 1.5) +
          offsetBox.leftX +
          specs.widthThreshold * 4 +
          (PlinkoPhysxService.bucketOffsetRequiringRows[rule.rows] ?? 0);
        const y = offsetBox.bottomY + 20;
        return {
          x,
          y,
          topLeftX: x - topWidth / 2,
          topRightX: x + topWidth / 2,
          bottomLeftX: x - bottomWidth / 2,
          bottomRightX: x + bottomWidth / 2,
          bottomY: y + specs.height,
        };
      }),
      specs,
    };
  }

  simulateDropping(
    gameRule: PlinkoRules,
    { coords: bucketCoords, specs: bucketSpecs }: BucketsDataType,
    pegs: PegCoordinationsType[],
    ball: PlinkoBallType,
    timeout: number = 5000, // in milliseconds
  ) {
    const startedAt = Date.now(),
      destinationY = bucketCoords[0].y + bucketSpecs.heightThreshold;

    while (Date.now() - startedAt <= timeout) {
      ball.vy += gameRule.gravity;
      ball.vy *= gameRule.friction;
      ball.vx *= gameRule.friction;
      ball.x += ball.vx * gameRule.horizontalSpeedFactor;
      ball.y += ball.vy * gameRule.verticalSpeedFactor;

      // Collision with pegs
      pegs.forEach((peg, i) => {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!ball.rapidImpacts) {
          ball.rapidImpacts = [];
        }
        if (dist < ball.radius + peg.radius) {
          const angle = Math.atan2(dy, dx);
          ball.vx = Math.cos(angle) * gameRule.horizontalSpeedFactor;
          if (ball.vx >= 0) {
            ball.vx = Math.max(ball.vx, 0.001);
          } else {
            ball.vx = Math.min(ball.vx, -0.001);
          }

          ball.rapidImpacts[i] = (ball.rapidImpacts?.[i] ?? 0) + 1;
          ball.vy =
            (Math.sin(angle) * gameRule.verticalSpeedFactor) /
            ball.rapidImpacts[i];
        }
      });

      if (ball.y >= destinationY) {
        let bucketInContactIndex = bucketCoords.findIndex(
          (b) => ball.x >= b.topLeftX && ball.x <= b.topRightX,
        );

        if (bucketInContactIndex === -1) {
          // Considering the most left and right buckets with a little threshold as landing targets
          if (
            ball.x >= bucketCoords[0].topLeftX - bucketSpecs.widthThreshold &&
            ball.x <= bucketCoords[0].topRightX
          ) {
            bucketInContactIndex = 0;
          } else if (
            ball.x <=
              bucketCoords[bucketCoords.length - 1].topRightX +
                bucketSpecs.widthThreshold &&
            ball.x >= bucketCoords[bucketCoords.length - 1].topLeftX
          ) {
            bucketInContactIndex = bucketCoords.length - 1;
          }
        }
        return bucketInContactIndex;
      }
    }
    return -1;
  }

  findDroppingBall(
    gameRule: PlinkoRules,
    buckets: BucketsDataType,
    pegs: PegsDataType,
    targetBucketIndex: number,
    { y0, v0 = null, radius }: InitialBallStateType,
    dx: number = 5,
  ): DeterministicPlinkoBallType {
    const board = this.getBoardSpecs(gameRule.rows);
    const startTime = Date.now();
    const correctos = [];

    if (!v0) {
      v0 = {
        vx: Math.random() * 3 - 3,
        vy: Math.random() * 3 - 3, // TODO: test it with random too
      };
    }

    for (let x0 = pegs.borders.leftX - dx; x0 <= board.width; x0 += dx) {
      if (
        this.simulateDropping(gameRule, buckets, pegs.coords, {
          x: x0,
          y: y0,
          ...v0,
          radius,
          rapidImpacts: [],
        }) === targetBucketIndex
      ) {
        correctos.push(x0);
      }
    }

    console.log('Simulation took', (Date.now() - startTime) / 1000, 'sec');
    console.log(`found ${correctos.length} results.`);

    return {
      x: correctos[(Math.random() * correctos.length) | 0],
      y: y0,
      ...v0,
      radius,
      rapidImpacts: [],
      bucketIndex: targetBucketIndex,
    };
  }
}
