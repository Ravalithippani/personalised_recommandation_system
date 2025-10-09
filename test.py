
import pyarrow
print(pyarrow.__version__)  # Should print without error
import pandas as pd
pd.read_parquet("data/movie_embeddings.parquet")  # Test a file load