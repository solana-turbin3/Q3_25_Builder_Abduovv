import { Idl } from "@coral-xyz/anchor";

export const IDL: Idl = {
  "address": "TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM",
  "metadata": {
    "name": "Turbin3_prereq",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [112, 114, 101, 114, 101, 113, 115]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "github",
          "type": "string"
        }
      ]
    },
    {
      "name": "submit_ts",
      "discriminator": [137, 241, 199, 223, 125, 33, 85, 217],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [112, 114, 101, 114, 101, 113, 115]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "collection",
          "writable": true
        },
        {
          "name": "authority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [99, 111, 108, 108, 101, 99, 116, 105, 111, 110]
              },
              {
                "kind": "account",
                "path": "collection"
              }
            ]
          }
        },
        {
          "name": "mpl_core_program",
          "address": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ApplicationAccount",
      "discriminator": [255, 176, 4, 245, 188, 253, 124, 25]
    }
  ],
  "types": [
    {
      "name": "ApplicationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "preReqTs",
            "type": "bool"
          },
          {
            "name": "preReqRs",
            "type": "bool"
          },
          {
            "name": "github",
            "type": "string"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PreReqTsNotCompleted",
      "msg": "TS submission not completed."
    },
    {
      "code": 6001,
      "name": "PreReqTsAlreadyCompleted",
      "msg": "TS submission already completed."
    },
    {
      "code": 6002,
      "name": "PreReqRsAlreadyCompleted",
      "msg": "Rust submission already completed."
    },
    {
      "code": 6003,
      "name": "PreReqRsNotInTimeWindow",
      "msg": "Submission not allowed."
    }
  ]
};

export type Turbin3Prereq = typeof IDL;
  