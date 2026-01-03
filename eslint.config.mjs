//@ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['eslint.config.mjs'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'commonjs',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            // --- TYPE SAFETY (Paling Penting) ---
            '@typescript-eslint/no-explicit-any': 'error', // Larang penggunaan 'any', gunakan 'unknown'
            '@typescript-eslint/explicit-function-return-type': 'error', // Semua function di Service/Controller wajib punya tipe return
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Larang variabel nganggur kecuali diawali underscore
            '@typescript-eslint/no-non-null-assertion': 'error', // Larang operator '!', paksa pengecekan 'if (data)'
            '@typescript-eslint/naming-convention': [
                // Paksa standar penamaan TypeScript
                'error',
                { selector: 'class', format: ['PascalCase'] },
                { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
            ],

            // --- ASYNC & PROMISE (Mencegah Bug Logic) ---
            '@typescript-eslint/no-floating-promises': 'error', // Pastikan semua async function di-'await' atau di-handle
            '@typescript-eslint/await-thenable': 'error', // Larang 'await' pada fungsi yang bukan Promise
            '@typescript-eslint/no-misused-promises': 'error', // Mencegah promise salah tempat (misal di kondisi if)

            // --- CLEAN CODE & REFACTORING ---
            '@typescript-eslint/no-unsafe-argument': 'error', // Pastikan argumen function sesuai tipe
            '@typescript-eslint/no-unsafe-member-access': 'error', // Larang akses properti dari object yang tipenya nggak jelas
            '@typescript-eslint/no-unsafe-call': 'error', // Larang manggil function yang tipenya 'any'
            '@typescript-eslint/no-shadow': 'error', // Larang nama variabel yang sama di scope berbeda (shadowing)

            // --- BEST PRACTICES ---
            'no-console': 'warn', // Gunakan LoggerService, jangan console.log
            'prefer-const': 'error', // Gunakan const jika variabel tidak di-reassign
            'no-return-await': 'off', // Di NestJS/TS, return await kadang diperlukan untuk stack trace
            '@typescript-eslint/return-await': 'warn',
        },
    },
);
