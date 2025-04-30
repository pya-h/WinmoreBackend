import { Injectable, MethodNotAllowedException } from '@nestjs/common';
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
  public static readonly bucketOffsetRequiringRows = { 10: -10, 11: 10 }; // fixme: this can be removed after size refactor
  public static readonly bucketSpecs: BucketSpecsType = {
    height: 55,
    widthThreshold: 5,
    heightThreshold: 30,
    cornerRadius: 10,
    bottomRatio: 0.7,
  };

  getBoardSpecs(rows: number) {
    return {
      height: PlinkoPhysxService.boardOffsets.height + (rows - 1) * 50,
      width: PlinkoPhysxService.boardOffsets.width + Math.max(0, rows - 9) * 40,
      pegsOffset: 40,
    };
  }

  getPegs(
    rows: number,
    radius: number = 9,
    spacing: number = 50,
    firstRowY: number = 100,
    firstRowPegsCount: number = 3,
  ): PegsDataType {
    const pegs: { x: number; y: number; radius: number }[] = [];
    const { width, pegsOffset } = this.getBoardSpecs(rows);
    const halfBoardWidth = width / 2;
    let leastLeft = Infinity;
    for (let row = 0; row < rows; row++) {
      const halfRow = row / 2;
      for (let i = 0; i < row + firstRowPegsCount; i++) {
        const x = halfBoardWidth + (i - halfRow) * spacing - pegsOffset;
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
    pegs: PegCoordinationsType[],
    bucketSpecs = PlinkoPhysxService.bucketSpecs,
  ): BucketsDataType {
    const y = offsetBox.bottomY + 20,
      pegsRadius = pegs[0].radius;
    return {
      coords: rule.multipliers.map((multiplier, index) => {
        const topLeftX = pegs[pegs.length - index - 2].x + pegsRadius / 3,
          topRightX = pegs[pegs.length - index - 1].x - pegsRadius / 3;
        const topWidth = topRightX - topLeftX,
          bottomWidth = topWidth * bucketSpecs.bottomRatio;
        const x = topLeftX + topWidth / 2;
        return {
          x: topLeftX + topWidth / 2,
          y,
          topLeftX,
          topRightX,
          bottomLeftX: x - bottomWidth / 2,
          bottomRightX: x + bottomWidth / 2,
          bottomY: y + bucketSpecs.height,
        };
      }),
      specs: bucketSpecs,
    };
  }

  simulateDropping(
    gameRule: PlinkoRules,
    { coords: bucketCoords, specs: bucketSpecs }: BucketsDataType,
    pegs: PegCoordinationsType[],
    ball: PlinkoBallType,
    timeout: number = 3000, // in milliseconds
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
    xOffset = 30,
    dVx: number = 1,
  ): DeterministicPlinkoBallType {
    const startTime = Date.now();
    const correctos = [];
    if (!v0) {
      v0 = {
        vx: Math.random() * 3 - 3,
        vy: Math.random() * 3 - 3,
      };
    }

    for (
      dVx = targetBucketIndex > ((buckets.coords.length / 2) | 0) ? dVx : -dVx;
      !correctos.length;
      v0.vx += dVx
    ) {
      for (
        let x0 = pegs.coords[0].x - xOffset, endX = pegs.coords[2].x + xOffset;
        x0 <= endX; // the drop x must be on top of first row pegs
        x0 += dx
      ) {
        const decidedBucketIndex = this.simulateDropping(
          gameRule,
          buckets,
          pegs.coords,
          {
            x: x0,
            y: y0,
            ...v0,
            radius,
            rapidImpacts: [],
          },
        );
        if (decidedBucketIndex === targetBucketIndex) {
          correctos.push({ x: x0, ...v0 });
        } else if (decidedBucketIndex === -1) {
          throw new MethodNotAllowedException(
            'Failed simulating due to large number of bets; Feel free to try again by reloading!',
          );
        }
      }
    }
    console.log('Simulation took', (Date.now() - startTime) / 1000, 'sec');
    console.log(`found ${correctos.length} results.`);

    return {
      ...(correctos.length > 1
        ? correctos[(Math.random() * correctos.length) | 0]
        : correctos[0]),
      y: y0,
      radius,
      rapidImpacts: [],
      bucketIndex: targetBucketIndex,
    };
  }
}
