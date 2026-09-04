import Particles from "@tsparticles/react";
import { useMemo } from "react";

export default function BubbleBackground() {
    const options = useMemo(() => ({
        fullScreen: {
            enable: true,
            zIndex: 0,
        },
        particles: {
            number: {
                value: 50,
            },
            paint: {
                fill: {
                    color: {
                        value: [
                            "#1f7a4f",
                            "#4caf7f",
                            "#6fcf97",
                            "#8fd3aa",
                            "#b7e4c7",
                        ],
                    },
                },
            },
            shape: {
                type: "circle",
            },
            opacity: {
                value: {
                    min: 0.2,
                    max: 0.5,
                },
            },
            size: {
                value: {
                    min: 15,
                    max: 40,
                },
            },
            move: {
                enable: true,
                speed: 0.5,
                random: true,
                straight: false,
                outModes: {
                    default: "bounce" as const,
                },
            },
        },
    }), []);

    return (
        <Particles
            id="bubble-background"
            options={options}
        />
    );
}