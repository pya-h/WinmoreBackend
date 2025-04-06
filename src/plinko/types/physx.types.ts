export type PlinkoBallType = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rapidImpacts?: number[];
};

export type DeterministicPlinkoBallType = PlinkoBallType & {
  bucketIndex: number;
};

export type InitialBallStateType = {
  radius: number;
  y0: number;
  v0?: { vx: number; vy: number };
};

export type PegCoordinationsType = {
  x: number;
  y: number;
  radius: number;
};

export type BoxBordersType = {
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
};

export type PegsDataType = {
  coords: PegCoordinationsType[];
  borders: BoxBordersType;
};

export type BucketCoordinationsType = {
  x: number;
  y: number;
  topLeftX: number;
  topRightX: number;
  bottomLeftX: number;
  bottomRightX: number;
  bottomY: number;
  multiplier: number;
};

export type BucketSpecsType = {
  width: number;
  height: number;
  widthThreshold: number;
  heightThreshold: number;
  cornerRadius: number;
  topRatio: number;
  bottomRatio: number;
};

export type BucketsDataType = {
  coords: BucketCoordinationsType[];
  specs: BucketSpecsType;
};
