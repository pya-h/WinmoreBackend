import { Injectable } from '@nestjs/common';
import { PlinkoRules } from '@prisma/client';

@Injectable()
export class PlinkoPhysxService {
  static readonly boardOffsets = {
    width: 600,
    height: 200,
  };

  static readonly bucketSpecs = {
    width: 60,
    height: 80,
    widthThreshold: 5,
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
  ) {
    const pegs: { x: number; y: number; radius: number }[] = [];
    const halfBoardWidth = this.getBoardSpecs(rows).width / 2,
      halfRows = rows / 2;
    let leastLeft = Infinity;
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i <= row + 2; i++) {
        const x = halfBoardWidth + (i - halfRows) * spacing - bucketWidth;
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
    rows: number,
    xOffset: number,
    yOffset: number,
    specs = PlinkoPhysxService.bucketSpecs,
  ) {
    return {
      coords: Array.from({ length: rows - 1 }) // TODO: may not be accurate for some rows count
        .fill(0)
        .map((_, index) => {
          const topWidth = specs.width * specs.topRatio;
          const bottomWidth = specs.width * specs.bottomRatio;
          const x =
            index * (specs.width + specs.widthThreshold * 1.5) +
            xOffset +
            specs.widthThreshold * 4;
          const y = yOffset + 20;
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

  // FIXME: revise types
  simulateDropping(
    gameRule: PlinkoRules,
    buckets: Record<string, number>[],
    pegs: Record<string, number>[],
    ball: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      rapidImpacts?: number[];
    },
    bucketYThreshold: number,
    bucketWidthThreshold: number, // TODO: Combine bucketsSpecs and buckets as one, after defining and revising types
  ) {
    // TODO: maybe add a safety break for loop? (e.g. break if took more than 1,2,? sec)
    while (true) {
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

      if (ball.y >= buckets[0].y + bucketYThreshold) {
        // Find the closest bucket
        let bucketInContactIndex = -1;

        if (
          ball.x >= buckets[0].topLeftX - bucketWidthThreshold &&
          ball.x <= buckets[buckets.length - 1].topRightX + bucketWidthThreshold
        ) {
          for (let i = 0; i < buckets.length - 1; i++) {
            if (
              ball.x >= buckets[i].topLeftX &&
              ball.x < buckets[i + 1].topLeftX
            ) {
              bucketInContactIndex = i;
              break;
            }
          }
          if (bucketInContactIndex === -1) {
            // ball fell into the first or last bucket threshold
            bucketInContactIndex =
              ball.x >= buckets[buckets.length - 1].topLeftX &&
              ball.x <=
                buckets[buckets.length - 1].topRightX + bucketWidthThreshold
                ? buckets.length - 1
                : 0;
          }
          if (bucketInContactIndex !== -1) {
            ball.x = buckets[bucketInContactIndex].x;
            ball.y =
              buckets[bucketInContactIndex].bottomY - bucketWidthThreshold;
            ball.vx = 0;
            ball.vy = 0;
          }
        }
        return bucketInContactIndex;
      }
    }
  }

  // FIXME: revise types
  findDroppingBall(
    gameRule: PlinkoRules,
    buckets: Record<string, number>[],
    pegs: Record<string, number>[],
    targetBucketIndex: number,
    dropY: number,
    ballRadius: number,
    v0?: { vx: number; vy: number },
    bucketSpecs = PlinkoPhysxService.bucketSpecs,
    dx: number = 5,
  ) {
    const board = this.getBoardSpecs(gameRule.rows);
    const startTime = Date.now();
    const correctXs = [];
    let bucketIndex = -1;
    let dropX = 95; // FIXME: After defining types, revise this => pegs.borders.leftX
    if (!v0) {
      v0 = {
        vx: Math.random() * 6 - 3,
        vy: 0,
      };
    }
    while (dropX <= board.width) {
      dropX += dx;
      bucketIndex = this.simulateDropping(
        gameRule,
        buckets,
        pegs,
        {
          x: dropX,
          y: dropY,
          ...v0,
          radius: ballRadius,
          rapidImpacts: [],
        },
        bucketSpecs.height / 2, // TODO: Combine bucketsSpecs and buckets as one, after defining and revising types
        bucketSpecs.widthThreshold,
      );
      if (bucketIndex === targetBucketIndex) {
        correctXs.push(dropX);
      }
    }

    console.log('Simulation took', (Date.now() - startTime) / 1000, 'sec');
    console.log(`found ${correctXs.length} results.`);
    return {
      x: correctXs[(Math.random() * correctXs.length) | 0],
      y: dropY,
      ...v0,
      radius: ballRadius,
      rapidImpacts: [],
    };
  }
}
