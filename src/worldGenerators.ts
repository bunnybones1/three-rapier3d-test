import AdditiveField3D from "./noise/AdditiveField3D";
import AdditiveGroupField3D from "./noise/AdditiveGroupField3D";
import DistortedField3D from "./noise/DistortedField3D";
import GradientField3D from "./noise/GradientField3D";
import MaxField3D from "./noise/MaxField3D";
import NoiseField3D from "./noise/NoiseField3D";
import ScaleScalarField3D from "./noise/ScaleScalarField3D";
import ScaleVectorField3D from "./noise/ScaleVectorField3D";
import SinField3D from "./noise/SinField3D";
import SquareSquareField3D from "./noise/SquareSquareField3D";
import { makeDeepDownDistortedNoise } from "./noise/field3DHelpers";

const PRESEED = 1;
const SEED = 2 + PRESEED;
const SEED2 = 3 + PRESEED;

export const worldGenerators = {
  rottenLumps() {
    const s = 2;
    return new AdditiveField3D(
      new GradientField3D(0, -12.5, 0, -12),
      new DistortedField3D(
        new DistortedField3D(
          new DistortedField3D(
            makeDeepDownDistortedNoise(s * 0.00025, 800, 480, 10, SEED + 5),
            new NoiseField3D(s * 0.0005, 100, SEED2 + 11),
            new NoiseField3D(s * 0.001, 300, SEED2 + 12),
            new NoiseField3D(s * 0.0005, 100, SEED2 + 13)
          ),
          new NoiseField3D(s * 0.005, 10, SEED2 + 1),
          new NoiseField3D(s * 0.01, 30, SEED2 + 2),
          new NoiseField3D(s * 0.005, 10, SEED2 + 3)
        ),
        new NoiseField3D(s * 0.05, 1.5, SEED2 + 2),
        new NoiseField3D(s * 0.1, 4, SEED2 + 3),
        new NoiseField3D(s * 0.05, 1.5, SEED2 + 4)
      )
    );
  },

  sharpRocks() {
    const s = 2;
    return new AdditiveField3D(
      new GradientField3D(0, -12.5, 0, -12),
      new DistortedField3D(
        new DistortedField3D(
          new DistortedField3D(
            makeDeepDownDistortedNoise(s * 0.00025, 800, 480, 10, SEED + 5),
            new NoiseField3D(s * 0.05, 1.5, SEED2 + 2),
            new NoiseField3D(s * 0.1, 4, SEED2 + 3),
            new NoiseField3D(s * 0.05, 1.5, SEED2 + 4)
          ),
          new NoiseField3D(s * 0.005, 10, SEED2 + 1),
          new NoiseField3D(s * 0.01, 30, SEED2 + 2),
          new NoiseField3D(s * 0.005, 10, SEED2 + 3)
        ),
        new NoiseField3D(s * 0.0005, 100, SEED2 + 11),
        new NoiseField3D(s * 0.001, 300, SEED2 + 12),
        new NoiseField3D(s * 0.0005, 100, SEED2 + 13)
      )
    );
  },
  redRocks() {
    const s = 2;
    return new MaxField3D(
      new AdditiveField3D(
        new GradientField3D(0, -120.5, 0, -12),
        new NoiseField3D(s * 0.005, 1000, SEED2 + 1)
      ),
      new AdditiveGroupField3D([
        new AdditiveField3D(
          new GradientField3D(0, -30.5, 0, -800),
          new AdditiveGroupField3D([
            new ScaleScalarField3D(
              new SinField3D(new GradientField3D(0, 1, 0)),
              50
            ),
            new ScaleScalarField3D(
              new SinField3D(new GradientField3D(0, 2, 0, Math.PI * 0.5)),
              25
            ),
            new ScaleScalarField3D(
              new SinField3D(new GradientField3D(0, 0.337, 0)),
              150
            ),
          ])
        ),
        new ScaleVectorField3D(new NoiseField3D(0.015, 1900), 1, 0.00005, 1),
        new ScaleScalarField3D(
          new SquareSquareField3D(
            new SquareSquareField3D(
              new SinField3D(new GradientField3D(0, 2, 0))
            )
          ),
          -40
        ),
        new ScaleScalarField3D(
          new SquareSquareField3D(
            new SquareSquareField3D(
              new SquareSquareField3D(
                new SinField3D(
                  new DistortedField3D(
                    new GradientField3D(0.4, 0, 0),
                    new NoiseField3D(s * 0.005, 35, SEED2 + 11)
                  )
                )
              )
            )
          ),
          -120
        ),
        new ScaleScalarField3D(
          new SquareSquareField3D(
            new SquareSquareField3D(
              new SinField3D(
                new DistortedField3D(
                  new GradientField3D(1.2, 0, 0.5),
                  new NoiseField3D(s * 0.05, 15, SEED2 + 11)
                )
              )
            )
          ),
          -20
        ),
      ])
    );
  },
};
