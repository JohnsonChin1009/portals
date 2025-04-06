# Portals

## a sdk for integrating native zkLogin on Polygon chains (Proof of Concept)


### Motive behind the project
---
Recently I've been exploring a lot with zero-knowledge proofs (zkPs) and have stumbled upon something called zkLogin.

I first interacted with zkLogin on Sui, where they have the first (I've believe it is... don't hate me if it isn't) to implement a native zkLogin solution on their chain which were later further backed up by [Enoki](https://docs.enoki.mystenlabs.com/), a sdk for developers to easily integrate it into their dApps.

### Why zkLogin?
---
Easy, zkLogin features users proving ownership of their wallets by signing in using OAuth Providers. This eliminates the need to memorize seed phrases and private keys, potentially reducing the chance of leaking through human error.

Besides that, integrating a native zkLogin solution also features customizability as well as cohesiveness with the chain you are interacting, sponsored transactions can easily be achieved as well as account abstraction which greatly improve the user experience.

### How I built it?
---
Well, I didn't successfully built it due to manpower and time constraint. I also didn't have enough knowledge to quickly understand how the entire thing would work, so it's still a half way project.

For zkCicurts and zkProof generation, I've used
- [circomlib](https://docs.circom.io/)
- [snarkjs](https://github.com/iden3/snarkjs)

Deployed on Polygon

### Future Enhancements
I genuinely would advise anyone that is reading this, to not use the code in the repository, as it's still a WIP (Work in progress) product, would continue exploring how zkPs would shape the overall zkLogin scene and continue levelling up.

### Additional Resources
---
ZK Verifier Contract deployed [here](https://amoy.polygonscan.com/address/0x2cBa16cFE146Bf688Eb75cF6C8f21B522c5a853F#code)