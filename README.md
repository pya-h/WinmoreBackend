# WinmoreBackend

WinmoreBackend is a server-side application built with NestJS, designed to support blockchain-based games. The current implementation provides backend services for two games: **Plinko** and **Dream Mine**. The platform is focused on scalability, code effectiveness, and performance, ensuring a robust foundation for future game integrations.

## Features

- **Game Support**: Plinko and Dream Mine, with extensible architecture for additional games.
- **Referral System**: Enables user referrals to promote organic growth.
- **Centralized Wallet Management**: Secure and efficient handling of user wallets.
- **Point System**: Planned feature for rewarding user engagement (soon).

## Code Quality & Performance

The codebase is structured for maintainability and clarity, leveraging NestJS best practices. Performance optimizations are in place for handling concurrent game sessions and wallet operations. The modular design facilitates easy updates and feature additions.

## Plinko Game Simulation

The Plinko game logic is implemented with efficient, precise, and fast algorithms to simulate game results. The code ensures accurate outcome generation and high performance, supporting real-time gameplay and seamless user experience.

## Chain Support & Token Integration

The indexer is designed to be fully configurable, allowing seamless support for any blockchain and token. To support a new chain and token, simply provide the desired chain data, RPC, and token contract addresses in seed script. No code changes required.

** Admin endpoints will soon be added.

## Frontend
   I've also collaberated in project's Frontend development; Checkout this repo in my second git account:
      https://github.com/pydea-rs/WinMore-Frontend
   Which is developed using NextJS.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/pya-h/WinmoreBackend.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables as needed.

4. Run prisma migrations.

   ```bash
   npm run migrate[:dev]
   ```

5. Run seed script to provide basic required data; You can modify values & rules in prisma/seed.db.js
   ```bash
   npm run seed
   ```
6. Start the server:
   ```bash
   npm run start
   ```

## Contributing

Contributions are welcome. Please follow the established code style and submit pull requests for review.

## License

This project is licensed under the MIT License.
